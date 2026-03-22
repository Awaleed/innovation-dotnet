using Gridify;
using Gridify.EntityFramework;
using Innovation.Application.Common.Models;

namespace Innovation.Application.Common.Extensions;

public static class QueryableExtensions
{
    public static async Task<Paging<TEntity>> ApplyFilteredAsync<TEntity>(
        this IQueryable<TEntity> queryable,
        FilteredQuery<TEntity> filteredQuery
    )
    {
        filteredQuery.ApplyDefaults();
        return await queryable.GridifyAsync(filteredQuery, filteredQuery.Mapper);
    }
}
