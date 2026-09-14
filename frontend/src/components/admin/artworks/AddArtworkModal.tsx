import ArtworkFormModal, {
  type ArtworkFormData,
} from "./ArtworkFormModal";

interface AddArtworkModalProps {
  onClose: () => void;
  onSubmit: (data: ArtworkFormData) => void;
}

export default function AddArtworkModal({
  onClose,
  onSubmit,
}: AddArtworkModalProps) {
  return (
    <ArtworkFormModal
      mode="add"
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}
