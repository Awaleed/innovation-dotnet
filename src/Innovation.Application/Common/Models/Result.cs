namespace Innovation.Application.Common.Models;

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Value { get; }
    public string? Error { get; }
    public ResultStatus Status { get; }

    private Result(T? value, string? error, ResultStatus status)
    {
        Value = value;
        Error = error;
        Status = status;
        IsSuccess = status == ResultStatus.Success;
    }

    public static Result<T> Success(T value) => new(value, null, ResultStatus.Success);
    public static Result<T> Failure(string error) => new(default, error, ResultStatus.Failure);
    public static Result<T> NotFound(string? error = null) => new(default, error ?? "Not found", ResultStatus.NotFound);
}

public enum ResultStatus
{
    Success,
    Failure,
    NotFound
}
