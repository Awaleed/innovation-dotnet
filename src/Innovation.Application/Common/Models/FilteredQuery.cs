using Gridify;

namespace Innovation.Application.Common.Models;

public abstract class FilteredQuery<TEntity>
{
    private GridifyMapper<TEntity>? _mapper;

    public virtual string DefaultOrderBy => "createdAt desc";

    public GridifyMapper<TEntity> Mapper => _mapper ??= BuildMapper();

    protected abstract void ConfigureMapper(GridifyMapper<TEntity> mapper);

    private GridifyMapper<TEntity> BuildMapper()
    {
        var mapper = new GridifyMapper<TEntity>();
        ConfigureMapper(mapper);
        return mapper;
    }
}
