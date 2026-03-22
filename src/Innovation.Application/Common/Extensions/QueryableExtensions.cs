using Gridify;
using Gridify.EntityFramework;
using Innovation.Application.Common.Models;

namespace Innovation.Application.Common.Extensions;

public static class QueryableExtensions
{
    public static async Task<Paging<TEntity>> ApplyFilteredAsync<TEntity>(
        this IQueryable<TEntity> queryable,
        GridifyQuery gridifyQuery,
        FilteredQuery<TEntity> filteredQuery
    )
    {
        gridifyQuery.OrderBy ??= filteredQuery.DefaultOrderBy;
        return await queryable.GridifyAsync(gridifyQuery, filteredQuery.Mapper);
    }
}
