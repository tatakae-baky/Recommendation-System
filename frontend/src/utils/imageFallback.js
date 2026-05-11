export function getImageUrl(item) {
  if (!item) return "";
  if (item.image_url) return item.image_url;
  if (item.image_relative_path) return `/images/${item.image_relative_path}`;
  return "";
}

export function fallbackLabel(item) {
  return item?.product_type_name || item?.garment_group_name || "Fashion item";
}
