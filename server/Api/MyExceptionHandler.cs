using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

public class MyExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, 
        Exception exception, CancellationToken cancellationToken)
    {
        //  the status code based on the type of exception
        httpContext.Response.StatusCode = exception is ValidationException
            ? StatusCodes.Status400BadRequest            // the user sent bad data
            : StatusCodes.Status500InternalServerError;  // something broke on the server

        //  Send the error message as JSON (ProblemDetails)
        await httpContext.Response.WriteAsJsonAsync(
            new ProblemDetails { Title = exception.Message },
            cancellationToken);

        // handled this exception
        return true;
    }
    
}