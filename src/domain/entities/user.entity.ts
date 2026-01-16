export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly hashedPassword: string,
    public readonly role: string
  ) {}

  hasRole(role: string): boolean {
    return this.role === role;
  }

  isAdmin(): boolean {
    return this.role === "admin";
  }
}
