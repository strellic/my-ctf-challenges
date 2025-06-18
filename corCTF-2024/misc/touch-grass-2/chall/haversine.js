
const haversine = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3
    const phi1 = lat1 * Math.PI / 180
    const phi2 = lat2 * Math.PI / 180
    const deltaPhi = (lat2 - lat1) * Math.PI / 180
    const deltaLambda = (lon2 - lon1) * Math.PI / 180

    const a = (
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2)
        + Math.cos(phi1)
        * Math.cos(phi2)
        * Math.sin(deltaLambda / 2)
        * Math.sin(deltaLambda / 2)
    )

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
};

const length = (waypoints) => {
    if (waypoints.length === 0) return 0

    let total = 0
    for (let i = 0; i < waypoints.length - 1; i++) {
        const [aLat, aLon] = waypoints[i]
        const [bLat, bLon] = waypoints[i + 1]
        total += haversine(aLat, aLon, bLat, bLon)
    }
}

module.exports = { haversine, length }