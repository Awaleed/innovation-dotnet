namespace Innovation.Application.Common.Models;

/// <summary>
/// Flat pagination response. No envelope, no nesting.
/// Frontend reads: response.items, response.page, response.totalPages
/// </summary>
public record PaginatedResponse<T>(
    List<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
)
{
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    public static PaginatedResponse<T> From(PaginatedList<T> list) => new(
        Items: list.Items.ToList(),
        Page: list.PageIndex,
        PageSize: list.Items.Count,
        TotalCount: list.TotalCount,
        TotalPages: list.TotalPages
    );

    public static PaginatedResponse<T> Create(
        List<T> items, int totalCount, int page, int pageSize) => new(
        Items: items,
        Page: page,
        PageSize: pageSize,
        TotalCount: totalCount,
        TotalPages: (int)Math.Ceiling(totalCount / (double)pageSize)
    );
}
