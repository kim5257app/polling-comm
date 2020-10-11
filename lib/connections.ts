import { AnyId } from 'anyid';

export default class Connections {
  private static readonly CLIENT_ID_LENGTH = 8;

  connList: Object = {};

  public makeClientId(): string {
    let clientId: string;

    do {
      clientId = new AnyId()
        .encode('Aa0')
        .length(Connections.CLIENT_ID_LENGTH)
        .time('ms')
        .id();
    } while (Object.prototype.hasOwnProperty.call(this.connList, clientId));

    return clientId;
  }
}
