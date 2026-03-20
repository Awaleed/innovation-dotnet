using System.Security.Claims;
using System.Text.Json;
using InertiaCore;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

public class AuthController(IHttpClientFactory httpClientFactory) : Controller
{
    // ========== Pages ==========

    [HttpGet("/login")]
    public IActionResult Login()
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect("/dashboard");

        return Inertia.Render("Auth/Login", new { canResetPassword = false });
    }

    [HttpGet("/register")]
    public IActionResult Register()
    {
        if (User.Identity?.IsAuthenticated == true)
            return Redirect("/dashboard");

        return Inertia.Render("Auth/Register");
    }

    [Authorize]
    [HttpGet("/dashboard")]
    public IActionResult Dashboard()
    {
        return Inertia.Render("Dashboard");
    }

    // ========== Form Submissions (Inertia POST) ==========

    [HttpPost("/login")]
    public async Task<IActionResult> LoginPost([FromBody] JsonElement body)
    {
        var email = body.GetProperty("email").GetString()!;
        var password = body.GetProperty("password").GetString()!;

        var client = httpClientFactory.CreateClient("identity-api");
        var loginPayload = JsonSerializer.Serialize(new { email, password });
        var response = await client.PostAsync("login",
            new StringContent(loginPayload, System.Text.Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            ModelState.AddModelError("email", "Invalid email or password.");
            Inertia.Share("flash", new { success = (string?)null, error = "Invalid email or password." });
            return Inertia.Render("Auth/Login", new { canResetPassword = false, oldInput = new { email } });
        }

        // Get access token and fetch user info
        var tokenJson = await response.Content.ReadAsStringAsync();
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

        var claims = new List<Claim>
        {
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, userName),
            new(ClaimTypes.GivenName, userName),
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1) });

        return Redirect("/dashboard");
    }

    [HttpPost("/register")]
    public async Task<IActionResult> RegisterPost([FromBody] JsonElement body)
    {
        var client = httpClientFactory.CreateClient("identity-api");
        var response = await client.PostAsync("register",
            new StringContent(body.GetRawText(), System.Text.Encoding.UTF8, "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            // Parse Identity.API errors and add to ModelState
            var errorContent = await response.Content.ReadAsStringAsync();
            try
            {
                var errorData = JsonSerializer.Deserialize<JsonElement>(errorContent);
                if (errorData.TryGetProperty("errors", out var errors))
                {
                    foreach (var error in errors.EnumerateObject())
                    {
                        var firstMsg = error.Value.EnumerateArray().FirstOrDefault().GetString();
                        if (firstMsg != null)
                            ModelState.AddModelError(error.Name, firstMsg);
                    }
                }
            }
            catch { }

            if (ModelState.ErrorCount == 0)
                ModelState.AddModelError("email", "Registration failed.");

            // Build oldInput from the submitted body (exclude password)
            var oldInput = new Dictionary<string, string>();
            foreach (var prop in body.EnumerateObject())
            {
                if (!prop.Name.Equals("password", StringComparison.OrdinalIgnoreCase) &&
                    !prop.Name.Equals("password_confirmation", StringComparison.OrdinalIgnoreCase))
                    oldInput[prop.Name] = prop.Value.GetString() ?? "";
            }

            Inertia.Share("flash", new { success = (string?)null, error = "Registration failed. Please check the form." });
            return Inertia.Render("Auth/Register", new { oldInput });
        }

        // Auto-login after register
        var email = body.GetProperty("email").GetString()!;
        var password = body.GetProperty("password").GetString()!;

        var loginPayload = JsonSerializer.Serialize(new { email, password });
        var loginResponse = await client.PostAsync("login",
            new StringContent(loginPayload, System.Text.Encoding.UTF8, "application/json"));

        if (loginResponse.IsSuccessStatusCode)
        {
            var claims = new List<Claim>
            {
                new(ClaimTypes.Email, email),
                new(ClaimTypes.Name, email),
                new(ClaimTypes.GivenName, email),
            };

            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties { IsPersistent = true, ExpiresUtc = DateTimeOffset.UtcNow.AddHours(1) });
        }

        return Redirect("/dashboard");
    }

    [HttpPost("/logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Redirect("/login");
    }
}
