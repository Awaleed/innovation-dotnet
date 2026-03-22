using System.Text.Json.Serialization;
using Gridify;

namespace Innovation.Application.Common.Models;

public abstract class FilteredQuery<TEntity> : GridifyQuery
{
    private GridifyMapper<TEntity>? _mapper;

    [JsonIgnore]
    public virtual string DefaultOrderBy => "createdAt desc";

    [JsonIgnore]
    public GridifyMapper<TEntity> Mapper => _mapper ??= BuildMapper();

    protected abstract void ConfigureMapper(GridifyMapper<TEntity> mapper);

    private GridifyMapper<TEntity> BuildMapper()
    {
        var mapper = new GridifyMapper<TEntity>();
        ConfigureMapper(mapper);
        return mapper;
    }

    public void ApplyDefaults()
    {
        OrderBy ??= DefaultOrderBy;
    }
}
