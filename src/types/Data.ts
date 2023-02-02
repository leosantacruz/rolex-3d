interface colors {
    baseColors: any[],
    numberColors:any[],
}
export default interface Data{
    isLoaded: boolean,
    loadingProgress: number,
    api: any,
    currentStep: number,
    contenido: any,
    debugMode: boolean,
    device: string,
    materials: any,
    animationState:boolean,
    colors : colors,
    selectedCategory:string
}