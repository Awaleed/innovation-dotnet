using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Controllers;

/// <summary>
/// Proxies /api/auth/* requests from the frontend to the Identity.API service.
/// This avoids CORS issues since the frontend calls same-origin.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthApiProxyController(IHttpClientFactory httpClientFactory) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register()
    {
        return await ProxyPost("api/auth/register");
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login()
    {
        return await ProxyPost("api/auth/login");
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        return await ProxyPost("api/auth/logout");
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        return await ProxyGet("api/auth/me");
    }

    private async Task<IActionResult> ProxyPost(string path)
    {
        var client = httpClientFactory.CreateClient("identity-api");

        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync();

        var request = new HttpRequestMessage(HttpMethod.Post, path)
        {
            Content = new StringContent(body, System.Text.Encoding.UTF8, "application/json")
        };

        CopyAuthHeader(request);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

        return StatusCode((int)response.StatusCode, content);
    }

    private async Task<IActionResult> ProxyGet(string path)
    {
        var client = httpClientFactory.CreateClient("identity-api");

        var request = new HttpRequestMessage(HttpMethod.Get, path);
        CopyAuthHeader(request);

        var response = await client.SendAsync(request);
        var content = await response.Content.ReadAsStringAsync();

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
