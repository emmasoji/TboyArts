import ArtworkFormModal, {
  type ArtworkFormData,
} from "./ArtworkFormModal";

interface AddArtworkModalProps {
  onClose: () => void;
  onSubmit: (
    data: ArtworkFormData,
    imageFile: File | null,
  ) => void | Promise<void>;
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
