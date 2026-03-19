using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

/// <summary>
/// Proxies auth requests to Identity.API's built-in Identity endpoints.
/// Signs the user in/out via cookie authentication on the Web app.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthApiProxyController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] JsonElement body)
    {
        // Forward to Identity.API's built-in /register endpoint
        var client = httpClientFactory.CreateClient("identity-api");

        var response = await client.PostAsync("register",
            new StringContent(body.GetRawText(), System.Text.Encoding.UTF8, "application/json"));

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            Response.ContentType = "application/json";
            return StatusCode((int)response.StatusCode, content);
        }

        // Registration succeeded — now login to get tokens and create session
        var email = body.GetProperty("email").GetString()!;
        var password = body.GetProperty("password").GetString()!;

        return await LoginInternal(email, password);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] JsonElement body)
    {
        var email = body.GetProperty("email").GetString()!;
        var password = body.GetProperty("password").GetString()!;

        return await LoginInternal(email, password);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("me")]
    public IActionResult Me()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Unauthorized();
        }

        return Ok(new
        {
            id = User.FindFirstValue(ClaimTypes.NameIdentifier),
            name = User.FindFirstValue(ClaimTypes.GivenName),
            email = User.FindFirstValue(ClaimTypes.Email),
        });
    }

    private async Task<IActionResult> LoginInternal(string email, string password)
    {
        var client = httpClientFactory.CreateClient("identity-api");

        // Call Identity.API's built-in /login endpoint (token mode)
        var loginPayload = JsonSerializer.Serialize(new { email, password });
        var loginResponse = await client.PostAsync("login",
            new StringContent(loginPayload, System.Text.Encoding.UTF8, "application/json"));

        if (!loginResponse.IsSuccessStatusCode)
        {
            var errorContent = await loginResponse.Content.ReadAsStringAsync();
            Response.ContentType = "application/json";
            return StatusCode((int)loginResponse.StatusCode, errorContent);
        }

        // Got access token — now fetch user info from /manage/info
        var tokenJson = await loginResponse.Content.ReadAsStringAsync();
        var tokenData = JsonSerializer.Deserialize<JsonElement>(tokenJson);
        var accessToken = tokenData.GetProperty("accessToken").GetString()!;

        var infoRequest = new HttpRequestMessage(HttpMethod.Get, "manage/info");
        infoRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);
        var infoResponse = await client.SendAsync(infoRequest);

        string userName = email;

        if (infoResponse.IsSuccessStatusCode)
        {
            var infoJson = await infoResponse.Content.ReadAsStringAsync();
            var infoData = JsonSerializer.Deserialize<JsonElement>(infoJson);
            if (infoData.TryGetProperty("email", out var emailProp))
                userName = emailProp.GetString() ?? email;
        }

        // Create claims and sign in with cookie authentication
        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, userName),
        };

        // Try to get the user's name from the custom Name property via a workaround
        // The built-in /manage/info doesn't return custom fields, so we store email as name for now
        // This will be improved when we add a custom /me endpoint
        claims.Add(new Claim(ClaimTypes.GivenName, userName));

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            principal,
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1),
            });

        return Ok(new
        {
            user = new { name = userName, email }
        });
    }
}
