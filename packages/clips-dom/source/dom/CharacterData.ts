import {CHANNEL, DATA} from './constants';
import type {Document} from './Document';
import {ChildNode} from './ChildNode';

export class CharacterData extends ChildNode {
  [DATA] = '';

  constructor(data: any, ownerDocument?: Document) {
    super(ownerDocument);
    this.setData(data);
  }

  protected setData(data: any) {
    let str = '';
    if (data != null) {
      str = typeof data === 'string' ? data : String(data);
    }
    this[DATA] = str;
    this[CHANNEL]?.setText(this as any, str);
  }

  get data() {
    return this[DATA];
  }

  set data(data: any) {
    this.setData(data);
  }
}
