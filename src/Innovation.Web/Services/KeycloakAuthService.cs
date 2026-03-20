using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Innovation.Web.Services;

public class KeycloakAuthService(IHttpClientFactory httpClientFactory)
{
    private const string Realm = "innovation";
    private const string ClientId = "innovation-web";
    private const string ClientSecret = "innovation-web-secret";

    private string TokenEndpoint => $"/realms/{Realm}/protocol/openid-connect/token";
    private string LogoutEndpoint => $"/realms/{Realm}/protocol/openid-connect/logout";
    private string AdminUsersEndpoint => $"/admin/realms/{Realm}/users";

    /// <summary>
    /// Authenticate user via Keycloak's Direct Access Grant (Resource Owner Password Credentials).
    /// </summary>
    public async Task<KeycloakTokenResponse?> LoginAsync(string email, string password)
    {
        var client = httpClientFactory.CreateClient("keycloak");

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["client_id"] = ClientId,
            ["client_secret"] = ClientSecret,
            ["username"] = email,
            ["password"] = password,
            ["scope"] = "openid profile email",
        });

        var response = await client.PostAsync(TokenEndpoint, content);

        if (!response.IsSuccessStatusCode)
            return null;

        return await response.Content.ReadFromJsonAsync<KeycloakTokenResponse>();
    }

    /// <summary>
    /// Register a new user via Keycloak Admin REST API.
    /// </summary>
    public async Task<KeycloakRegisterResult> RegisterAsync(string name, string email, string password)
    {
        var client = httpClientFactory.CreateClient("keycloak");

        var adminToken = await GetServiceAccountTokenAsync();
        if (adminToken is null)
            return new KeycloakRegisterResult(false, new Dictionary<string, string[]>
            {
                ["email"] = ["Registration service is unavailable."],
            });

        var userPayload = new
        {
            username = email,
            email,
            emailVerified = true,
            enabled = true,
            firstName = name,
            lastName = "",
            requiredActions = Array.Empty<string>(),
            credentials = new[]
            {
                new { type = "password", value = password, temporary = false },
            },
        };

        var request = new HttpRequestMessage(HttpMethod.Post, AdminUsersEndpoint)
        {
            Content = JsonContent.Create(userPayload),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await client.SendAsync(request);

        if (response.IsSuccessStatusCode)
            return new KeycloakRegisterResult(true);

        // Parse Keycloak error response
        var errorContent = await response.Content.ReadAsStringAsync();

        try
        {
            var errorData = JsonSerializer.Deserialize<JsonElement>(errorContent);

            if (errorData.TryGetProperty("errorMessage", out var errorMessage))
            {
                var msg = errorMessage.GetString() ?? "Registration failed.";

                // Keycloak returns "User exists with same username" or "User exists with same email"
                if (msg.Contains("exists", StringComparison.OrdinalIgnoreCase))
                {
                    return new KeycloakRegisterResult(false, new Dictionary<string, string[]>
                    {
                        ["email"] = ["A user with this email already exists."],
                    });
                }

                return new KeycloakRegisterResult(false, new Dictionary<string, string[]>
                {
                    ["email"] = [msg],
                });
            }
        }
        catch
        {
            // Ignore parse errors
        }

        return new KeycloakRegisterResult(false, new Dictionary<string, string[]>
        {
            ["email"] = ["Registration failed. Please try again."],
        });
    }

    /// <summary>
    /// Revoke the refresh token to logout from Keycloak.
    /// </summary>
    public async Task LogoutAsync(string? refreshToken)
    {
        if (string.IsNullOrEmpty(refreshToken))
            return;

        var client = httpClientFactory.CreateClient("keycloak");

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["client_id"] = ClientId,
            ["client_secret"] = ClientSecret,
            ["refresh_token"] = refreshToken,
        });

        await client.PostAsync(LogoutEndpoint, content);
    }

    /// <summary>
    /// Extract a ClaimsPrincipal from the Keycloak token response.
    /// Decodes the access token JWT to read claims (no signature validation needed
    /// since we just received it directly from Keycloak over HTTPS).
    /// </summary>
    public ClaimsPrincipal ExtractClaims(KeycloakTokenResponse tokenResponse)
    {
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(tokenResponse.AccessToken);

        var claims = new List<Claim>();

        // Subject (user ID)
        var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
        if (sub is not null)
            claims.Add(new Claim(ClaimTypes.NameIdentifier, sub));

        // Name — prefer 'name' claim, fall back to 'given_name', then 'preferred_username'
        var name = jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value
                   ?? jwt.Claims.FirstOrDefault(c => c.Type == "given_name")?.Value
                   ?? jwt.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value;
        if (name is not null)
        {
            claims.Add(new Claim(ClaimTypes.Name, name));
            claims.Add(new Claim(ClaimTypes.GivenName, name));
        }

        // Email
        var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
        if (email is not null)
            claims.Add(new Claim(ClaimTypes.Email, email));

        // Roles — from the custom 'roles' claim in our protocol mapper
        foreach (var roleClaim in jwt.Claims.Where(c => c.Type == "roles"))
        {
            claims.Add(new Claim(ClaimTypes.Role, roleClaim.Value));
        }

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        return new ClaimsPrincipal(identity);
    }

    /// <summary>
    /// Get a service account token using client_credentials grant.
    /// Used for Admin REST API calls (e.g., user registration).
    /// </summary>
    private async Task<string?> GetServiceAccountTokenAsync()
    {
        var client = httpClientFactory.CreateClient("keycloak");

        var content = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "client_credentials",
            ["client_id"] = ClientId,
            ["client_secret"] = ClientSecret,
        });

        var response = await client.PostAsync(TokenEndpoint, content);

        if (!response.IsSuccessStatusCode)
            return null;

        var tokenResponse = await response.Content.ReadFromJsonAsync<KeycloakTokenResponse>();
        return tokenResponse?.AccessToken;
    }
}
