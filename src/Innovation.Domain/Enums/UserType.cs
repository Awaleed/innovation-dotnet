namespace Innovation.Domain.Enums;

public enum UserType
{
    SuperAdmin,
    Admin,
    User,
    Evaluator,
    Jury,
    Mentor,
}

public static class UserTypeExtensions
{
    public static string ToSlug(this UserType userType) =>
        userType switch
        {
            UserType.SuperAdmin => "super-admin",
            UserType.Admin => "admin",
            UserType.User => "user",
            UserType.Evaluator => "evaluator",
            UserType.Jury => "jury",
            UserType.Mentor => "mentor",
            _ => throw new ArgumentOutOfRangeException(nameof(userType), userType, null),
        };

    public static UserType FromSlug(string slug) =>
        slug switch
        {
            "super-admin" => UserType.SuperAdmin,
            "admin" => UserType.Admin,
            "user" => UserType.User,
            "evaluator" => UserType.Evaluator,
            "jury" => UserType.Jury,
            "mentor" => UserType.Mentor,
            _ => throw new ArgumentOutOfRangeException(nameof(slug), slug, null),
        };
}
