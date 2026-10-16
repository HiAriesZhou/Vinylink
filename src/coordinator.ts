/** One live iframe per tab; destroying its browsing context stops its media. */
export class PlaybackCoordinator {
  private active?: { owner: object; dispose: ()=>void };
  private generation=0;
  open(owner: object, mount: (isCurrent: ()=>boolean)=>()=>void): void {
    const ticket=++this.generation;
    const old=this.active;this.active=undefined;old?.dispose();
    const dispose=mount(()=>this.generation===ticket);
    if(ticket!==this.generation){dispose();return;}
    this.active={owner,dispose};
  }
  close(owner:object):void {
    if(this.active?.owner!==owner)return;
    this.generation++;const active=this.active;this.active=undefined;active.dispose();
  }
  stop():void { if(this.active)this.close(this.active.owner); }
}
