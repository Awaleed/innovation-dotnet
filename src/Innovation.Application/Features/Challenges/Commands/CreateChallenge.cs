using ErrorOr;
using FluentValidation;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Features.Challenges.Mappings;
using Innovation.Application.Features.Challenges.Models;
using Innovation.Domain;
using Innovation.Domain.Entities.Challenge;
using Innovation.Domain.Enums;
using MediatR;

namespace Innovation.Application.Features.Challenges.Commands;

public record CreateChallengeCommand(
    TranslatableString Title,
    TranslatableString? Description,
    TranslatableString? Organizer,
    TranslatableString? Location,
    int? CategoryId,
    int? InnovationTypeId,
    ChallengeStatus? Status,
    ChallengeDifficulty? Difficulty,
    ChallengeParticipationType? ParticipationType,
    ChallengeSubmissionType? SubmissionType,
    int? MaxParticipants,
    int? TeamSizeMin,
    int? TeamSizeMax,
    string? Language,
    string? ContactEmail,
    string? ContactPhone,
    bool Featured,
    bool IsPublic,
    bool EnableComments,
    DateTime? StartDate,
    DateTime? EndDate,
    DateTime? SubmissionDeadline
) : ICommand<ErrorOr<ChallengeDetailResponse>>;

public class CreateChallengeValidator : AbstractValidator<CreateChallengeCommand>
{
    public CreateChallengeValidator()
    {
        RuleFor(x => x.Title).NotNull();
        RuleFor(x => x.Title.En).NotEmpty().When(x => x.Title != null);
    }
}

public class CreateChallengeHandler(IAppDbContext db)
    : IRequestHandler<CreateChallengeCommand, ErrorOr<ChallengeDetailResponse>>
{
    public async Task<ErrorOr<ChallengeDetailResponse>> Handle(CreateChallengeCommand cmd, CancellationToken ct)
    {
        var challenge = new Challenge
        {
            PublicUlid = Ulid.NewUlid().ToString(),
            Title = cmd.Title,
            Slug = new TranslatableString(
                cmd.Title.En?.ToLowerInvariant().Replace(" ", "-"),
                cmd.Title.Ar),
            Description = cmd.Description ?? new(),
            Organizer = cmd.Organizer,
            Location = cmd.Location,
            CategoryId = cmd.CategoryId,
            InnovationTypeId = cmd.InnovationTypeId,
            Status = cmd.Status ?? ChallengeStatus.Draft,
            Difficulty = cmd.Difficulty,
            ParticipationType = cmd.ParticipationType,
            SubmissionType = cmd.SubmissionType,
            MaxParticipants = cmd.MaxParticipants,
            TeamSizeMin = cmd.TeamSizeMin,
            TeamSizeMax = cmd.TeamSizeMax,
            Language = cmd.Language,
            ContactEmail = cmd.ContactEmail,
            ContactPhone = cmd.ContactPhone,
            Featured = cmd.Featured,
            IsPublic = cmd.IsPublic,
            EnableComments = cmd.EnableComments,
            StartDate = cmd.StartDate,
            EndDate = cmd.EndDate,
            SubmissionDeadline = cmd.SubmissionDeadline,
        };

        db.Challenges.Add(challenge);
        await db.SaveChangesAsync(ct);

        return challenge.ToDetailResponse();
    }
}
