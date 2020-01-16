export default class MockRedis {
  private readonly v: { [key: string]: string } = {};
  private readonly sv: { [key: string]: string[] } = {};

  public get = async (key: string) => {
    return this.v[key] ?? null;
  };

  public set = async (key: string, value: string) => {
    return (this.v[key] = value);
  };

  public del = async (...keys: string[]) => {
    const count = keys.filter(key => key in this.sv).length;
    keys.forEach(key => delete this.v[key]);
    return count;
  };

  public smembers = async (key: string) => {
    return this.sv[key] ?? [];
  };

  public sadd = async (key: string, value: string) => {
    if (!(key in this.sv)) {
      this.sv[key] = [];
    }
    return this.sv[key].push(value);
  };

  public srem = async (key: string, value: string) => {
    if (!(key in this.sv)) {
      return 0;
    }
    const oldCount = this.sv[key].length;
    this.sv[key] = this.sv[key].filter(v => v !== value);
    return oldCount - this.sv[key].length;
  };
}
