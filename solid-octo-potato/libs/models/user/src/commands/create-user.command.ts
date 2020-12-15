export class UserCreateCommand {
    constructor(
        public readonly firstName: string,
        public readonly lastName: string,        
        public readonly email: string,
        public readonly upn: string,
        public readonly aboutMe: string,
    ) {
        
    }
}