using Gridify;
using Innovation.Application.Common.Models;
using Innovation.Domain.Entities.Challenge;

namespace Innovation.Application.Features.Challenges.Filters;

public class ChallengeFilteredQuery : FilteredQuery<Challenge>
{
    protected override void ConfigureMapper(GridifyMapper<Challenge> mapper)
    {
        mapper.AddMap("title", c => c.Title.En!);
        mapper.AddMap("titleAr", c => c.Title.Ar!);
        mapper.AddMap("status", c => c.Status);
        mapper.AddMap("difficulty", c => c.Difficulty);
        mapper.AddMap("featured", c => c.Featured);
        mapper.AddMap("urgent", c => c.Urgent);
        mapper.AddMap("isPublic", c => c.IsPublic);
        mapper.AddMap("startDate", c => c.StartDate);
        mapper.AddMap("endDate", c => c.EndDate);
        mapper.AddMap("createdAt", c => c.CreatedAt);
        mapper.AddMap("categoryId", c => c.CategoryId);
    }
}
