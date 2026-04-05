export function validateItem(data) {
  const errors = {};

  if (!data.title?.trim())
    errors.title = "Title is required";
  else if (data.title.trim().length < 3)
    errors.title = "Title must be at least 3 characters";
  else if (data.title.trim().length > 100)
    errors.title = "Title must be under 100 characters";

  if (!data.price)
    errors.price = "Selling price is required";
  else if (isNaN(data.price) || Number(data.price) <= 0)
    errors.price = "Price must be greater than ₹0";
  else if (Number(data.price) > 100000)
    errors.price = "Price cannot exceed ₹1,00,000";

  if (data.originalPrice && Number(data.originalPrice) <= Number(data.price))
    errors.originalPrice = "Original price must be higher than selling price";

  if (!data.category)
    errors.category = "Category is required";

  if (!data.condition)
    errors.condition = "Condition is required";

  if (!data.gender)
    errors.gender = "Gender is required";

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateImageFile(file) {
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED  = ["image/jpeg", "image/png", "image/webp"];

  if (!ALLOWED.includes(file.type))
    return "Only JPG, PNG, and WebP images are allowed";

  if (file.size > MAX_SIZE)
    return "Image must be under 5MB";

  return null;
}