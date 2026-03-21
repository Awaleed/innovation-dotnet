using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Innovation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "challenge_groups",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Name = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_groups", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "innovation_types",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    Name = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_innovation_types", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "lookups",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    Type = table.Column<string>(
                        type: "character varying(100)",
                        maxLength: 100,
                        nullable: false
                    ),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    Name = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_lookups", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    KeycloakId = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    Name = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    Email = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                }
            );

            migrationBuilder.CreateTable(
                name: "challenges",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    PublicUlid = table.Column<string>(
                        type: "character varying(26)",
                        maxLength: 26,
                        nullable: true
                    ),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    InnovationTypeId = table.Column<int>(type: "integer", nullable: true),
                    TemplateId = table.Column<int>(type: "integer", nullable: true),
                    StartDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    EndDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    SubmissionDeadline = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    EvaluationStartDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    EvaluationEndDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    WinnersAnnouncedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Status = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    Difficulty = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    ParticipationType = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    SubmissionType = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    WinnerSelectionMethod = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    MaxParticipants = table.Column<int>(type: "integer", nullable: true),
                    TeamSizeMin = table.Column<int>(type: "integer", nullable: true),
                    TeamSizeMax = table.Column<int>(type: "integer", nullable: true),
                    MinEvaluatorsPerIdea = table.Column<int>(type: "integer", nullable: true),
                    Language = table.Column<string>(
                        type: "character varying(10)",
                        maxLength: 10,
                        nullable: true
                    ),
                    ContactEmail = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: true
                    ),
                    ContactPhone = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: true
                    ),
                    Featured = table.Column<bool>(type: "boolean", nullable: false),
                    Urgent = table.Column<bool>(type: "boolean", nullable: false),
                    IsPublic = table.Column<bool>(type: "boolean", nullable: false),
                    EnableComments = table.Column<bool>(type: "boolean", nullable: false),
                    AutoTransitionEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    AutomationSettings = table.Column<string>(type: "jsonb", nullable: true),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: false),
                    Location = table.Column<string>(type: "jsonb", nullable: true),
                    Organizer = table.Column<string>(type: "jsonb", nullable: true),
                    Slug = table.Column<string>(type: "jsonb", nullable: false),
                    Title = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenges_innovation_types_InnovationTypeId",
                        column: x => x.InnovationTypeId,
                        principalTable: "innovation_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull
                    );
                    table.ForeignKey(
                        name: "FK_challenges_lookups_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "lookups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_awards",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    AwardType = table.Column<string>(type: "text", nullable: true),
                    Value = table.Column<decimal>(
                        type: "numeric(12,2)",
                        precision: 12,
                        scale: 2,
                        nullable: true
                    ),
                    Icon = table.Column<string>(type: "text", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    Name = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_awards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_awards_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_intellectual_properties",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    IpType = table.Column<string>(type: "text", nullable: true),
                    IpStatus = table.Column<string>(type: "text", nullable: true),
                    ProtectionMechanism = table.Column<string>(type: "jsonb", nullable: true),
                    OwnershipTerms = table.Column<string>(type: "text", nullable: true),
                    LicenseType = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_intellectual_properties", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_intellectual_properties_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_objectives",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    Metrics = table.Column<string>(type: "jsonb", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    ExpectedOutcome = table.Column<string>(type: "jsonb", nullable: true),
                    Objective = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_objectives", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_objectives_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_requirements",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    RequirementType = table.Column<string>(type: "text", nullable: true),
                    Priority = table.Column<string>(type: "text", nullable: true),
                    Mandatory = table.Column<bool>(type: "boolean", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    Requirement = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_requirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_requirements_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_risks",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    Probability = table.Column<string>(type: "text", nullable: true),
                    Impact = table.Column<string>(type: "text", nullable: true),
                    OwnerId = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    MitigationStrategy = table.Column<string>(type: "jsonb", nullable: true),
                    RiskName = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_risks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_risks_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_challenge_risks_users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_sponsors",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    SponsorName = table.Column<string>(
                        type: "character varying(255)",
                        maxLength: 255,
                        nullable: false
                    ),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    WebsiteUrl = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    ContributionAmount = table.Column<decimal>(
                        type: "numeric(12,2)",
                        precision: 12,
                        scale: 2,
                        nullable: true
                    ),
                    SponsorshipType = table.Column<string>(type: "text", nullable: true),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_sponsors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_sponsors_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_sustainability_impacts",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    SdgAlignment = table.Column<string>(type: "jsonb", nullable: true),
                    QuantifiableMetrics = table.Column<string>(type: "jsonb", nullable: true),
                    Timeline = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    ImpactArea = table.Column<string>(type: "jsonb", nullable: true),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_sustainability_impacts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_sustainability_impacts_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_timelines",
                columns: table => new
                {
                    Id = table
                        .Column<int>(type: "integer", nullable: false)
                        .Annotation(
                            "Npgsql:ValueGenerationStrategy",
                            NpgsqlValueGenerationStrategy.IdentityByDefaultColumn
                        ),
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    MilestoneStartDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    MilestoneEndDate = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    CompletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Status = table.Column<string>(type: "text", nullable: true),
                    Deliverables = table.Column<string>(type: "jsonb", nullable: true),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    DeletedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: true
                    ),
                    Description = table.Column<string>(type: "jsonb", nullable: true),
                    MilestoneName = table.Column<string>(type: "jsonb", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_challenge_timelines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_challenge_timelines_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateTable(
                name: "challenge_users",
                columns: table => new
                {
                    ChallengeId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<string>(
                        type: "character varying(50)",
                        maxLength: 50,
                        nullable: false
                    ),
                    Status = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                    UpdatedAt = table.Column<DateTime>(
                        type: "timestamp with time zone",
                        nullable: false
                    ),
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_challenge_users",
                        x => new
                        {
                            x.ChallengeId,
                            x.UserId,
                            x.Role,
                        }
                    );
                    table.ForeignKey(
                        name: "FK_challenge_users_challenges_ChallengeId",
                        column: x => x.ChallengeId,
                        principalTable: "challenges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                    table.ForeignKey(
                        name: "FK_challenge_users_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade
                    );
                }
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_awards_ChallengeId",
                table: "challenge_awards",
                column: "ChallengeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_intellectual_properties_ChallengeId",
                table: "challenge_intellectual_properties",
                column: "ChallengeId",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_objectives_ChallengeId",
                table: "challenge_objectives",
                column: "ChallengeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_requirements_ChallengeId",
                table: "challenge_requirements",
                column: "ChallengeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_risks_ChallengeId",
                table: "challenge_risks",
                column: "ChallengeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_risks_OwnerId",
                table: "challenge_risks",
                column: "OwnerId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_sponsors_ChallengeId",
                table: "challenge_sponsors",
                column: "ChallengeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_sustainability_impacts_ChallengeId",
                table: "challenge_sustainability_impacts",
                column: "ChallengeId",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_timelines_ChallengeId",
                table: "challenge_timelines",
                column: "ChallengeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenge_users_UserId",
                table: "challenge_users",
                column: "UserId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenges_CategoryId",
                table: "challenges",
                column: "CategoryId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenges_Featured",
                table: "challenges",
                column: "Featured"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenges_InnovationTypeId",
                table: "challenges",
                column: "InnovationTypeId"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenges_PublicUlid",
                table: "challenges",
                column: "PublicUlid",
                unique: true,
                filter: "\"PublicUlid\" IS NOT NULL"
            );

            migrationBuilder.CreateIndex(
                name: "IX_challenges_Status",
                table: "challenges",
                column: "Status"
            );

            migrationBuilder.CreateIndex(name: "IX_lookups_Type", table: "lookups", column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                table: "users",
                column: "Email",
                unique: true
            );

            migrationBuilder.CreateIndex(
                name: "IX_users_KeycloakId",
                table: "users",
                column: "KeycloakId",
                unique: true
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "challenge_awards");

            migrationBuilder.DropTable(name: "challenge_groups");

            migrationBuilder.DropTable(name: "challenge_intellectual_properties");

            migrationBuilder.DropTable(name: "challenge_objectives");

            migrationBuilder.DropTable(name: "challenge_requirements");

            migrationBuilder.DropTable(name: "challenge_risks");

            migrationBuilder.DropTable(name: "challenge_sponsors");

            migrationBuilder.DropTable(name: "challenge_sustainability_impacts");

            migrationBuilder.DropTable(name: "challenge_timelines");

            migrationBuilder.DropTable(name: "challenge_users");

            migrationBuilder.DropTable(name: "challenges");

            migrationBuilder.DropTable(name: "users");

            migrationBuilder.DropTable(name: "innovation_types");

            migrationBuilder.DropTable(name: "lookups");
        }
    }
}
