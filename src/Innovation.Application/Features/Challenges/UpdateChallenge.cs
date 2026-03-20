using FluentValidation;
using Innovation.Application.Common.Interfaces;
using Innovation.Application.Common.Models;
using Innovation.Application.Features.Challenges.Shared;
using Innovation.Domain;
using Innovation.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Innovation.Application.Features.Challenges;

public record UpdateChallengeCommand(
    int Id,
    TranslatableString? Title,
    TranslatableString? Description,
    TranslatableString? Organizer,
    TranslatableString? Location,
    int? CategoryId,
    int? InnovationTypeId,
    ChallengeDifficulty? Difficulty,
    ChallengeParticipationType? ParticipationType,
    ChallengeSubmissionType? SubmissionType,
    int? MaxParticipants,
    int? TeamSizeMin,
    int? TeamSizeMax,
    string? Language,
    string? ContactEmail,
    string? ContactPhone,
    bool? Featured,
    bool? IsPublic,
    bool? EnableComments,
    DateTime? StartDate,
    DateTime? EndDate,
    DateTime? SubmissionDeadline
) : ICommand<Result<ChallengeDetailResponse>>;

public class UpdateChallengeValidator : AbstractValidator<UpdateChallengeCommand>
{
    public UpdateChallengeValidator()
    {
        RuleFor(x => x.Id).GreaterThan(0);
    }
}

public class UpdateChallengeHandler(IAppDbContext db) : IRequestHandler<UpdateChallengeCommand, Result<ChallengeDetailResponse>>
{
    public async Task<Result<ChallengeDetailResponse>> Handle(UpdateChallengeCommand cmd, CancellationToken ct)
    {
        var challenge = await db.Challenges
            .Include(c => c.Awards)
            .Include(c => c.Objectives)
            .Include(c => c.Requirements)
            .Include(c => c.Timeline)
            .Include(c => c.Sponsors)
            .FirstOrDefaultAsync(c => c.Id == cmd.Id, ct);

        if (challenge is null)
            return Result<ChallengeDetailResponse>.NotFound();

        if (cmd.Title is not null) challenge.Title = cmd.Title;
        if (cmd.Description is not null) challenge.Description = cmd.Description;
        if (cmd.Organizer is not null) challenge.Organizer = cmd.Organizer;
        if (cmd.Location is not null) challenge.Location = cmd.Location;
        if (cmd.CategoryId.HasValue) challenge.CategoryId = cmd.CategoryId;
        if (cmd.InnovationTypeId.HasValue) challenge.InnovationTypeId = cmd.InnovationTypeId;
        if (cmd.Difficulty.HasValue) challenge.Difficulty = cmd.Difficulty;
        if (cmd.ParticipationType.HasValue) challenge.ParticipationType = cmd.ParticipationType;
        if (cmd.SubmissionType.HasValue) challenge.SubmissionType = cmd.SubmissionType;
        if (cmd.MaxParticipants.HasValue) challenge.MaxParticipants = cmd.MaxParticipants;
        if (cmd.TeamSizeMin.HasValue) challenge.TeamSizeMin = cmd.TeamSizeMin;
        if (cmd.TeamSizeMax.HasValue) challenge.TeamSizeMax = cmd.TeamSizeMax;
        if (cmd.Language is not null) challenge.Language = cmd.Language;
        if (cmd.ContactEmail is not null) challenge.ContactEmail = cmd.ContactEmail;
        if (cmd.ContactPhone is not null) challenge.ContactPhone = cmd.ContactPhone;
        if (cmd.Featured.HasValue) challenge.Featured = cmd.Featured.Value;
        if (cmd.IsPublic.HasValue) challenge.IsPublic = cmd.IsPublic.Value;
        if (cmd.EnableComments.HasValue) challenge.EnableComments = cmd.EnableComments.Value;
        if (cmd.StartDate.HasValue) challenge.StartDate = cmd.StartDate;
        if (cmd.EndDate.HasValue) challenge.EndDate = cmd.EndDate;
        if (cmd.SubmissionDeadline.HasValue) challenge.SubmissionDeadline = cmd.SubmissionDeadline;

        await db.SaveChangesAsync(ct);

        return Result<ChallengeDetailResponse>.Success(challenge.ToDetailResponse());
    }
}
