using System.Text.Json.Serialization;

namespace Innovation.Application.Common.Models;

/// <summary>
/// Pagination wrapper matching PHP's SimpleCollection format:
/// { results, links, meta: { pagination } }
/// </summary>
public record SimpleCollection<T>(
    IReadOnlyList<T> Results,
    PaginationLinks Links,
    PaginationMeta Meta
);

public record PaginationLinks(
    string? Self,
    string? First,
    string? Prev,
    string? Next,
    string? Last
);

public record PaginationMeta(
    PaginationInfo Pagination
);

public record PaginationInfo(
    int Page,
    int Size,
    int Total,
    int TotalPages,
    bool MorePages
);

public static class SimpleCollectionExtensions
{
    /// <summary>
    /// Converts a PaginatedList to a SimpleCollection matching PHP's response shape.
    /// </summary>
    public static SimpleCollection<T> ToSimpleCollection<T>(
        this PaginatedList<T> list,
        string? baseUrl = null)
    {
        var page = list.PageIndex;
        var totalPages = list.TotalPages;

        string? BuildUrl(int? p) =>
            p.HasValue && baseUrl != null
                ? $"{baseUrl}{(baseUrl.Contains('?') ? '&' : '?')}page={p.Value}"
                : null;

        return new SimpleCollection<T>(
            Results: list.Items,
            Links: new PaginationLinks(
                Self: BuildUrl(page),
                First: BuildUrl(1),
                Prev: list.HasPreviousPage ? BuildUrl(page - 1) : null,
                Next: list.HasNextPage ? BuildUrl(page + 1) : null,
                Last: BuildUrl(totalPages)
            ),
            Meta: new PaginationMeta(new PaginationInfo(
                Page: page,
                Size: list.Items.Count,
                Total: list.TotalCount,
                TotalPages: totalPages,
                MorePages: list.HasNextPage
            ))
        );
    }
}
