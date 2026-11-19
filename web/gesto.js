// Group the decelerating tail of a trackpad gesture, while keeping distinct wheel notches.
export function createWheelGesture(){
  let previousAt=-1000,started=0,previousDelta=0,previousAxis=false,tailStarted=false;
  return function isNewGesture(event,delta,horizontal,inMotion,entering){
    const gap=event.timeStamp-previousAt,mag=Math.abs(delta),old=Math.abs(previousDelta);
    const notch=gap>=70&&mag>=40&&mag===old;
    const impulse=event.timeStamp-started>230&&old<=10&&mag>=3*old+16;
    const fading=mag<old||(tailStarted&&mag===old);
    const tail=fading&&(tailStarted||mag>=old*.30);
    const sameDirection=Math.sign(delta)===Math.sign(previousDelta);
    const changingAxis=horizontal!==previousAxis&&gap>65;
    const continued=!entering&&sameDirection&&(gap<180||(inMotion&&gap<650)||(tail&&gap<490))&&!notch&&!impulse&&!changingAxis;
    tailStarted=continued&&fading;previousAxis=horizontal;previousAt=event.timeStamp;previousDelta=delta;
    if(!continued) started=event.timeStamp;
    return !continued;
  };
}
