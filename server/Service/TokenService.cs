using System.Security.Claims;
using System.Text;
using Infrastructure;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace Service;
public record JwtSettings(string Secret, string Issuer, string Audience);

// Creates JWTs (JSON Web Tokens) for users who logged in successfully.
//
// What is a JWT?
// A long string in three parts separated by dots: HEADER.PAYLOAD.SIGNATURE
//   - Header:    which algorithm was used to sign it
//   - Payload:   the "claims", facts about the user (id, name, role, expiry)
//   - Signature: made from header + payload + our Secret

public class TokenService(JwtSettings settings)
{
    public string CreateToken(User user)
    {
        // Turn  Secret text into a key object the signing algorithm can use(check appsettings/Development.json).
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Secret));

        return new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            // claims : the facts stored inside the token
            Subject = new ClaimsIdentity([
                
                // subject- who the token belongs to
                // GetMe to find out which user is making a request
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId),              
                new Claim(JwtRegisteredClaimNames.UniqueName, user.Username),
               
                // what the user may do
                // reads this claim to decide if access is allowed
                new Claim("role", user.Role)                                     
            ]),
            Issuer = settings.Issuer,           // who made the token
            Audience = settings.Audience,       // who the token is for
            
            // The token stops working after 8 hours, and the user must log in
            // again. Limits the damage if a token is ever stolen.
            Expires = DateTime.UtcNow.AddHours(8),
            
            // Sign the token with the Secret 
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        });
    }
}