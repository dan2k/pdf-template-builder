import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        // If authentication fails or no token is provided, return a default guest object
        if (err || !user) {
            return { id: null, role: 'guest' };
        }
        return user;
    }
}
