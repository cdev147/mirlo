import React from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useArtistContext } from "state/ArtistContext";
import api from "services/api";
import { useSnackbar } from "state/SnackbarContext";
import Button from "components/common/Button";
import { css } from "@emotion/css";
import { getReleaseUrl } from "utils/artist";

const PublishButton: React.FC<{
  trackGroup: TrackGroup;
  reload: () => Promise<void>;
}> = ({ trackGroup, reload }) => {
  const { t } = useTranslation("translation", { keyPrefix: "manageAlbum" });
  const snackbar = useSnackbar();

  const [isPublishing, setIsPublishing] = React.useState(false);

  const { trackGroupId } = useParams();
  const {
    state: { artist },
  } = useArtistContext();

  const artistUserId = artist?.userId;

  const publishTrackGroup = React.useCallback(async () => {
    setIsPublishing(true);
    const anyIncomplete = trackGroup.tracks.find(
      (t) => t.audio?.uploadState !== "SUCCESS"
    );
    if (anyIncomplete && !window.confirm(t("areYouSurePublish") ?? "")) {
      setIsPublishing(false);
      return;
    }
    try {
      if (artistUserId && trackGroupId) {
        await api.put(
          `users/${artistUserId}/trackGroups/${trackGroupId}/publish`,
          {}
        );
        snackbar(t("publishedSuccess"), { type: "success" });
      }
    } catch (e) {
      console.error(e);
    } finally {
      await reload();
      setIsPublishing(false);
    }
  }, [trackGroup.tracks, artistUserId, trackGroupId, snackbar, t, reload]);

  const beforeReleaseDate = new Date(trackGroup.releaseDate) > new Date();

  const publishButton = beforeReleaseDate ? "publishPreorder" : "publish";
  const privateButton = beforeReleaseDate
    ? "makePreorderPrivate"
    : "makePrivate";

  return (
    <div>
      <Button
        isLoading={isPublishing}
        onClick={publishTrackGroup}
        disabled={isPublishing}
        className={css`
          margin-right: 0.75rem;
        `}
      >
        {t(trackGroup.published ? privateButton : publishButton)}
      </Button>
      {artist && trackGroup.published && (
        <Link to={getReleaseUrl(artist, trackGroup)}>
          <Button>{t(beforeReleaseDate ? "viewPreorder" : "view")}</Button>
        </Link>
      )}
    </div>
  );
};

export default PublishButton;
