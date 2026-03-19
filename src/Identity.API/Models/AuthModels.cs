namespace Innovation.Identity.API.Models;

public record RegisterRequest(string Name, string Email, string Password, string ConfirmPassword);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, DateTime ExpiresAt, UserInfo User);

public record UserInfo(string Id, string Name, string Email);
