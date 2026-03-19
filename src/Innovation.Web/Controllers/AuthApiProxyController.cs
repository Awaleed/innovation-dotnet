using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

/// <summary>
/// Proxies /api/auth/* requests from the frontend to the Identity.API service.
/// Sets HTTP-only auth cookie on successful login/register.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthApiProxyController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    private const string AuthCookieName = "auth_token";

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
        Response.Cookies.Delete(AuthCookieName);
        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        return await ProxyGet("api/auth/me");
    }

    /// <summary>
    /// Proxies login/register POST and sets auth cookie on success.
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
            // Parse response to extract token and set cookie
            var authResponse = JsonSerializer.Deserialize<JsonElement>(content);

            if (authResponse.TryGetProperty("token", out var tokenElement))
            {
                var token = tokenElement.GetString()!;
                var expiresAt = authResponse.GetProperty("expiresAt").GetDateTime();

                Response.Cookies.Append(AuthCookieName, token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = expiresAt,
                    Path = "/",
                });

                // Return only user info (not the token) to the frontend
                var user = authResponse.GetProperty("user");
                return Ok(new { user });
            }
        }

        Response.ContentType = "application/json";
        return StatusCode((int)response.StatusCode, content);
    }

    private async Task<IActionResult> ProxyGet(string path)
    {
        var client = httpClientFactory.CreateClient("identity-api");

        var request = new HttpRequestMessage(HttpMethod.Get, path);
        CopyAuthHeader(request);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        Response.ContentType = "application/json";
        return StatusCode((int)response.StatusCode, content);
    }

    private void CopyAuthHeader(HttpRequestMessage request)
    {
        if (Request.Headers.TryGetValue("Authorization", out var authHeader))
        {
            request.Headers.Authorization = AuthenticationHeaderValue.Parse(authHeader.ToString());
        }
    }
}
