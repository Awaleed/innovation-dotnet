using Innovation.Domain.Enums;

namespace Innovation.Infrastructure.Data.Seeders;

/// <summary>
/// Static permission configuration mirroring Laravel's config/permission_seeder.php.
/// Defines resources, actions, and default role mappings.
/// </summary>
public static class PermissionSeederConfig
{
    /// <summary>
    /// Permission definitions per user type.
    /// Key: UserType slug, Value: (Resources dict, standalone Actions list)
    /// Resources: resource name → pipe-separated actions
    /// </summary>
    public static readonly Dictionary<
        string,
        (Dictionary<string, string> Resources, List<string> Actions)
    > Permissions = new()
    {
        [UserType.Admin.ToSlug()] = (
            Resources: new Dictionary<string, string>
            {
                // Core admin functionality
                ["dashboard"] = "summary|analytics|financial|reports",
                ["users"] = "create|read|update|delete|forceDelete|restore|export|import",
                ["roles"] = "create|read|update|delete|assign",
                ["permissions"] = "create|read|update|delete|assign",
                // Admin management
                ["admins"] = "create|read|update|delete|forceDelete|restore",
                // Challenge management
                ["challenges"] =
                    "create|read|update|delete|forceDelete|restore|publish|unpublish|approve|reject",
                ["challenge_mentors"] = "create|read|update|delete|assign",
                ["challenge_sponsors"] = "create|read|update|delete",
                ["challenge_requirements"] = "create|read|update|delete",
                ["challenge_objectives"] = "create|read|update|delete",
                ["challenge_risks"] = "create|read|update|delete",
                ["challenge_timelines"] = "create|read|update|delete",
                // Idea management
                ["ideas"] = "create|read|update|delete|forceDelete|restore|approve|reject|evaluate",
                ["idea_steps"] = "create|read|update|delete",
                ["idea_team_members"] = "create|read|update|delete",
                ["idea_evaluators"] = "create|read|update|delete|assign",
                ["idea_methodologies"] = "create|read|update|delete",
                // Innovation management
                ["innovation_types"] = "create|read|update|delete",
                ["innovation_methodologies"] = "create|read|update|delete",
                // Evaluation management
                ["evaluation_templates"] = "create|read|update|delete",
                ["evaluation_stages"] = "create|read|update|delete",
                ["evaluation_factors"] = "create|read|update|delete",
                ["evaluation_factor_items"] = "create|read|update|delete",
                ["evaluation_factor_specialties"] = "create|read|update|delete|assign",
                ["evaluation_factor_stages"] = "create|read|update|delete",
                ["evaluation_assessment_values"] = "create|read|update|delete",
                ["evaluation_assessment_recommendations"] = "create|read|update|delete",
                // Jury management
                ["jury_members"] = "create|read|update|delete|assign",
                // User engagement
                ["comments"] = "create|read|update|delete|moderate",
                ["likes"] = "create|read|delete",
                ["bookmarks"] = "create|read|delete",
                ["attachments"] = "create|read|update|delete|download",
                // Support and reports
                ["issue_reports"] = "create|read|update|delete|resolve",
                // User profiles
                ["user_profiles"] = "read|update|delete",
                ["user_specialties"] = "read|update|assign|revoke",
                // System management
                ["settings"] = "read|update",
                ["audit_logs"] = "read|export",
                ["notifications"] = "create|read|update|delete|send",
                ["translations"] = "read|update",
                ["backups"] = "create|read|download|restore",
                ["cache"] = "clear",
                ["maintenance"] = "enable|disable",
            },
            Actions:
            [
                "panel_access",
                "view_statistics",
                "export_data",
                "import_data",
                "bulk_actions",
                "impersonate_users",
                "manage_settings",
                "view_system_info",
                "manage_integrations",
            ]
        ),
        [UserType.User.ToSlug()] = (
            Resources: new Dictionary<string, string>
            {
                ["challenges"] = "read|participate|submit",
                ["ideas"] = "create|read|update|delete|submit",
                ["comments"] = "create|read|update|delete",
                ["likes"] = "create|delete",
                ["bookmarks"] = "create|read|delete",
                ["attachments"] = "create|read|delete|download",
                ["issue_reports"] = "create|read",
                ["user_profiles"] = "read|update",
            },
            Actions:
            [
                "view_own_submissions",
                "edit_own_submissions",
                "delete_own_submissions",
                "view_public_content",
                "participate_in_challenges",
                "submit_ideas",
                "vote",
                "comment",
                "upload_files",
            ]
        ),
        [UserType.Evaluator.ToSlug()] = (
            Resources: new Dictionary<string, string>
            {
                ["ideas"] = "read|evaluate",
                ["evaluation_assessment_values"] = "create|read|update",
                ["evaluation_assessment_recommendations"] = "create|read|update",
                ["comments"] = "create|read",
            },
            Actions:
            [
                "evaluate_ideas",
                "submit_assessments",
                "view_assigned_ideas",
                "provide_recommendations",
            ]
        ),
        [UserType.Jury.ToSlug()] = (
            Resources: new Dictionary<string, string>
            {
                ["ideas"] = "read|evaluate|score",
                ["challenges"] = "read",
                ["evaluation_stages"] = "read",
            },
            Actions:
            [
                "final_evaluation",
                "select_winners",
                "view_all_submissions",
                "access_jury_panel",
            ]
        ),
        [UserType.Mentor.ToSlug()] = (
            Resources: new Dictionary<string, string>
            {
                ["challenges"] = "read|mentor",
                ["ideas"] = "read|guide",
                ["comments"] = "create|read",
            },
            Actions: ["mentor_participants", "provide_guidance", "view_assigned_challenges"]
        ),
    };

    /// <summary>
    /// Default role → permission pattern mappings.
    /// Wildcards (e.g., "admin:*") are expanded during seeding.
    /// </summary>
    public static readonly Dictionary<string, string[]> DefaultRoles = new()
    {
        ["super-admin"] = ["admin:*", "user:*", "evaluator:*", "jury:*", "mentor:*"],
        [UserType.Admin.ToSlug()] = ["admin:*"],
        [UserType.User.ToSlug()] = ["user:*"],
        [UserType.Evaluator.ToSlug()] = ["user:*", "evaluator:*"],
        [UserType.Jury.ToSlug()] = ["user:*", "evaluator:*", "jury:*"],
        [UserType.Mentor.ToSlug()] = ["user:*", "mentor:*"],
    };

    /// <summary>
    /// Generates all flat permission strings from the configuration.
    /// Format: {userTypeSlug}:{resource}:{action} and {userTypeSlug}:{standaloneAction}
    /// </summary>
    public static List<string> GenerateAllPermissions()
    {
        var all = new List<string>();

        foreach (var (prefix, (resources, actions)) in Permissions)
        {
            // Resource permissions: prefix:resource:action
            foreach (var (resource, actionsStr) in resources)
            {
                foreach (var action in actionsStr.Split('|'))
                {
                    all.Add($"{prefix}:{resource}:{action}");
                }
            }

            // Standalone actions: prefix:action
            foreach (var action in actions)
            {
                all.Add($"{prefix}:{action}");
            }
        }

        return all;
    }
}
