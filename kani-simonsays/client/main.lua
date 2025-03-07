local minigameActive = false
local minigameResult = 0

RegisterNUICallback('finishedMinigame', function(data, cb)
    SetNuiFocus(false, false)
    minigameResult:resolve(data.result)
    minigameActive = false
end)

function startSimonSays(stages) 
    if minigameActive then
        return
    end

    minigameActive = true
    minigameResult = promise.new()

    SendNUIMessage({
        action = 'startSimonSays',
        stages = stages or 4,
    })
    SetNuiFocus(true, true)

    local cAwait = Citizen.Await(minigameResult)
    return cAwait
end

exports('startSimonSays', startSimonSays)