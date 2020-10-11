import Connection from './connection';

export default class Group {
  connList: Array<Connection> = [];

  emit(name: string, payload: object): void {
    this.connList.forEach((conn) => {
      conn.emit(name, payload);
    });
  }

  add(connection: Connection): void {
    if (!this.hasConnection(connection)) {
      this.connList.push(connection);
    }
  }

  remove(connection: Connection): void {
    const idx = this.connList.findIndex((item) => item.id === connection.id);
    if (idx >= 0) {
      this.connList.splice(idx, 1);
    }
  }

  hasConnection(connection: Connection): boolean {
    return (this.connList.findIndex((item) => item.id === connection.id) >= 0);
  }

  length(): number {
    return this.connList.length;
  }
}
