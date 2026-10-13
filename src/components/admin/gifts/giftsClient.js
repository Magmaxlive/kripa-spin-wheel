

const API_URL='/api/admin/gifts'


async function handleResponse(response) {
    const data = await response.json().catch(()=> ({}));

    if (!response.ok){
        throw new Error(data.error || 'something went wrong')
    }

    return data;
}

function wait(ms = 350) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone(gift) {
    return { ...gift };
}


export async function listGifts() {
    const response = await fetch (API_URL,{
        method:'GET',
        cache:'no-store'
    });
    
    const data = await handleResponse(response);
    return data.gifts;
}

export async function createGift(input) {
    const response = await fetch (API_URL,{
        method:'POST',
        headers:{
            "Content-Type": "application/json",
        },
        body:JSON.stringify({
            ...input,
            stock: Number(input.stock),
            weight: Number(input.weight),
        }),
    })

    const data = await handleResponse(response);
    return data.gift;
}

export async function updateGift(id, input) {
    const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method:'PATCH',
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify(input)
        }
    );

    const data = await handleResponse(response);
    return data.gift;
}


export async function setGiftActive(id, isActive) {
    const response = await fetch(
        `${API_URL}/${encodeURIComponent(id)}`,
        {
            method:'PATCH',
            headers:{
                "Content-Type": "application/json",
            },
            body:JSON.stringify({
                is_active:isActive,
            })
        }
    );

    const data = await handleResponse(response);
    return data.gift;
}
