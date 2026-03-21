namespace Innovation.TsGen.Models;

public record RouteInfo(
    string Url,
    string Method,
    List<string> Parameters,
    string Controller,
    string Action
);
