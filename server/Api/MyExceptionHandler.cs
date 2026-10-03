using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

public class MyExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, 
        Exception exception, CancellationToken cancellationToken)
    {
        //  the status code based on the type of exception
        httpContext.Response.StatusCode = exception switch
        {
            ValidationException => StatusCodes.Status400BadRequest,           // bad data
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized, // wrong login / seized
            KeyNotFoundException => StatusCodes.Status404NotFound,            // doesn't exist
            _ => StatusCodes.Status500InternalServerError                     // bug on our side
        };
        
        //  Send the error message as JSON (ProblemDetails)
        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails { Title = exception.Message },
            cancellationToken);

        // handled this exception
        return true;
    }
    
}