using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

public class MyExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, 
        Exception exception, CancellationToken cancellationToken)
    {
        // 1. Choose the status code based on the type of exception
        httpContext.Response.StatusCode = exception is ValidationException
            ? StatusCodes.Status400BadRequest            // the user sent bad data
            : StatusCodes.Status500InternalServerError;  // something broke on the server

        // 2. Send the error message as JSON (ProblemDetails)
        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails { Title = exception.Message },
            cancellationToken);

        // 3. true = "I handled this exception, stop here"
        return true;
    }
    
}