using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

/// <summary>
/// Proxies /api/auth/* requests from the frontend to the Identity.API service.
/// Signs the user in/out via cookie authentication on success.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthApiProxyController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register()
    {
        return await ProxyAuthPost("api/auth/register");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login()
    {
        return await ProxyAuthPost("api/auth/login");
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

    /// <summary>
    /// Proxies login/register POST to Identity.API and signs the user in via cookie auth on success.
    /// </summary>
    private async Task<IActionResult> ProxyAuthPost(string path)
    {
        var client = httpClientFactory.CreateClient("identity-api");

        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
        };

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        if (response.IsSuccessStatusCode)
        {
            var authResponse = JsonSerializer.Deserialize<JsonElement>(content);

            if (authResponse.TryGetProperty("user", out var userElement))
            {
                var userId = userElement.GetProperty("id").GetString()!;
                var userName = userElement.GetProperty("name").GetString()!;
                var userEmail = userElement.GetProperty("email").GetString()!;

                // Create claims and sign in with cookie authentication
                var claims = new List<Claim>
                {
                    new(ClaimTypes.NameIdentifier, userId),
                    new(ClaimTypes.GivenName, userName),
                    new(ClaimTypes.Email, userEmail),
                    new(ClaimTypes.Name, userName),
                };

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

                return Ok(new { user = new { id = userId, name = userName, email = userEmail } });
            }
        }

        Response.ContentType = "application/json";
        return StatusCode((int)response.StatusCode, content);
    }
}
