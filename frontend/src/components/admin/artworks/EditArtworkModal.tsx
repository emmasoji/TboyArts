import ArtworkFormModal, {
  type ArtworkFormData,
} from "./ArtworkFormModal";

interface EditArtworkModalProps {
  artwork: Partial<ArtworkFormData>;
  onClose: () => void;
  onSubmit: (data: ArtworkFormData) => void;
}

export default function EditArtworkModal({
  artwork,
  onClose,
  onSubmit,
}: EditArtworkModalProps) {
  return (
    <ArtworkFormModal
      mode="edit"
      initialData={artwork}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
