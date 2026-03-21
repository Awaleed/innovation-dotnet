using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Innovation.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserKeycloakId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "KeycloakId",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_users_KeycloakId",
                table: "users",
                column: "KeycloakId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_KeycloakId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "KeycloakId",
                table: "users");
        }
    }
}
