using ErrorOr;
using Microsoft.AspNetCore.Mvc;

namespace Innovation.Web.Extensions;

public static class ErrorOrExtensions
{
    public static IActionResult ToActionResult<T>(
        this ErrorOr<T> result,
        Func<T, IActionResult> onSuccess
    )
    {
        return result.Match(onSuccess, ToProblems);
    }

    public static IActionResult ToActionResult<T>(this ErrorOr<T> result)
    {
        return result.Match(value => new OkObjectResult(value), ToProblems);
    }

    private static IActionResult ToProblems(List<Error> errors)
    {
        var first = errors.First();
        return first.Type switch
        {
            ErrorType.NotFound => new NotFoundObjectResult(new { error = first.Description }),
            ErrorType.Validation => new BadRequestObjectResult(
                new { errors = errors.Select(e => e.Description) }
            ),
            ErrorType.Conflict => new ConflictObjectResult(new { error = first.Description }),
            ErrorType.Forbidden => new ForbidResult(),
            _ => new ObjectResult(new { error = first.Description }) { StatusCode = 500 },
        };
    }
}
