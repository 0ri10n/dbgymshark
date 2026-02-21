const baseProducts = [
    { title: 'Vital Crop Top', type: 'Womens Crop Tops', price: 38, image: 'https://placehold.co/600x750?text=Vital+Crop+Top' },
    { title: 'Seamless Sports Bra', type: 'Womens Sports Bras', price: 42, image: 'https://placehold.co/600x750?text=Sports+Bra' },
    { title: 'Cropped Polo', type: 'Womens Crop Tops', price: 46, image: 'https://placehold.co/600x750?text=Cropped+Polo' },
    { title: 'Power Joggers', type: 'Mens Joggers', price: 58, image: 'https://placehold.co/600x750?text=Power+Joggers' },
    { title: 'Training Tee', type: 'Mens T-Shirts', price: 34, image: 'https://placehold.co/600x750?text=Training+Tee' },
    { title: 'Adapt Shorts', type: 'Mens Shorts', price: 40, image: 'https://placehold.co/600x750?text=Adapt+Shorts' },
    { title: 'Flex Leggings', type: 'Womens Leggings', price: 52, image: 'https://placehold.co/600x750?text=Flex+Leggings' },
    { title: 'Performance Tank', type: 'Womens Tanks', price: 30, image: 'https://placehold.co/600x750?text=Performance+Tank' },
];

const sizes = ['XS', 'S', 'M', 'L', 'XL'];

const mockProducts = Array.from({ length: 180 }, (_, index) => {
    const template = baseProducts[index % baseProducts.length];
    const serial = index + 1;
    const price = Number((template.price + (index % 9) * 1.75).toFixed(2));

    const variants = sizes.map((size, variantIndex) => ({
        size,
        color: 'Black',
        sku: `MOCK-${serial}-${size}`,
        price,
        inventory_quantity: (serial + variantIndex) % 5 === 0 ? 0 : 6 + ((serial + variantIndex) % 9),
        variant_id: `mock-variant-${serial}-${size}`,
    }));

    return {
        _id: `mock-product-${serial}`,
        title: `${template.title} ${Math.ceil(serial / baseProducts.length)}`,
        handle: `mock-product-${serial}`,
        description: `Mock product ${serial} for local development.`,
        vendor: 'MAKIA',
        tags: ['mock', 'development'],
        product_type: template.type,
        image_principal: template.image,
        price,
        variants,
        sizes_available: sizes,
    };
});

module.exports = mockProducts;
