using Gridify;
using Innovation.Domain.Entities.Challenge;

namespace Innovation.Application.Features.Challenges.Filters;

public class ChallengeGridifyMapper : GridifyMapper<Challenge>
{
    public ChallengeGridifyMapper()
    {
        AddMap("title", c => c.Title.En!);
        AddMap("titleAr", c => c.Title.Ar!);
        AddMap("status", c => c.Status);
        AddMap("difficulty", c => c.Difficulty);
        AddMap("featured", c => c.Featured);
        AddMap("urgent", c => c.Urgent);
        AddMap("isPublic", c => c.IsPublic);
        AddMap("startDate", c => c.StartDate);
        AddMap("endDate", c => c.EndDate);
        AddMap("createdAt", c => c.CreatedAt);
        AddMap("categoryId", c => c.CategoryId);
    }
}
