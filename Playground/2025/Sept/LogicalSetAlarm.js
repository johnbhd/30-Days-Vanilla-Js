function setAlarm(employed, vacation){
  return (employed == true && vacation == false ) ? true : false;
}

console.log(setAlarm(true, false)) // Result: true - 9/26/25 8:48pm
