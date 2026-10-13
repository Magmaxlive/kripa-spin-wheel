

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

// Replace with: POST /api/admin/gifts
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

// Replace with: PATCH /api/admin/gifts/:id
export async function updateGift(id, input) {
    await wait();
    gifts = gifts.map((gift) =>
        gift.id === id
            ? {
                  ...gift,
                  name: input.name,
                  stock: input.stock,
                  weight: input.weight,
                  is_active: input.is_active,
              }
            : gift
    );
    const updated = gifts.find((gift) => gift.id === id);
    return updated ? clone(updated) : null;
}

// Replace with: PATCH /api/admin/gifts/:id/active { is_active }
export async function setGiftActive(id, isActive) {
    await wait();
    gifts = gifts.map((gift) =>
        gift.id === id ? { ...gift, is_active: isActive } : gift
    );
    const updated = gifts.find((gift) => gift.id === id);
    return updated ? clone(updated) : null;
}
