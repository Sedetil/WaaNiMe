import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaBell } from 'react-icons/fa';
import styled from 'styled-components';
import Image404URL from '/src/assets/404.webp';
import {
  EpisodeList,
  Player,
  EmbedPlayer,
  WatchAnimeData as AnimeData,
  AnimeDataList,
  MediaSource,
  fetchAnimeEmbeddedEpisodes,
  fetchAnimeEpisodes,
  fetchAnimeData,
  fetchAnimeInfo,
  SkeletonPlayer,
  useCountdown,
} from '../index';
import { Episode } from '../index';

const WatchContainer = styled.div``;

const WatchWrapper = styled.div`
  font-size: 0.9rem;
  gap: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--global-primary-bg);
  color: var(--global-text);

  @media (min-width: 1000px) {
    flex-direction: row;
    align-items: flex-start;
  }
`;

const DataWrapper = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr 1fr; // TODO Aim for a 3:1 ratio
  width: 100%; // TODO Make sure this container can expand enough
  @media (max-width: 1000px) {
    grid-template-columns: auto;
  }
`;

const SourceAndData = styled.div<{ $videoPlayerWidth: string }>`
  width: ${({ $videoPlayerWidth }) => $videoPlayerWidth};
`;

const RalationsTable = styled.div`
  padding: 0;
  margin-top: 1rem;
  @media (max-width: 1000px) {
    margin-top: 0rem;
  }
`;

const VideoPlayerContainer = styled.div`
  position: relative;
  width: 100%;
  border-radius: var(--global-border-radius);

  @media (min-width: 1000px) {
    flex: 1 1 auto;
  }
`;

const EpisodeListContainer = styled.div`
  width: 100%;
  max-height: 100%;

  @media (min-width: 1000px) {
    flex: 1 1 500px;
    max-height: 100%;
  }

  @media (max-width: 1000px) {
    padding-left: 0rem;
  }
`;

const NoEpsFoundDiv = styled.div`
  text-align: center;
  margin-top: 7.5rem;
  margin-bottom: 10rem;
  @media (max-width: 1000px) {
    margin-top: 2.5rem;
    margin-bottom: 6rem;
  }
`;

const NoEpsImage = styled.div`
  margin-bottom: 3rem;
  max-width: 100%;

  img {
    border-radius: var(--global-border-radius);
    max-width: 100%;
    @media (max-width: 500px) {
      max-width: 70%;
    }
  }
`;

const StyledHomeButton = styled.button`
  color: white;
  border-radius: var(--global-border-radius);
  border: none;
  background-color: var(--primary-accent);
  margin-top: 0.5rem;
  font-weight: bold;
  padding: 1rem;
  position: absolute;
  transform: translate(-50%, -50%);
  transition: transform 0.2s ease-in-out;
  &:hover,
  &:active,
  &:focus {
    transform: translate(-50%, -50%) scale(1.05);
  }
  &:active {
    transform: translate(-50%, -50%) scale(0.95);
  }
`;

const IframeTrailer = styled.iframe`
  position: relative;
  border-radius: var(--global-border-radius);
  border: none;
  top: 0;
  left: 0;
  width: 70%;
  height: 100%;
  text-items: center;
  @media (max-width: 1000px) {
    width: 100%;
    height: 100%;
  }
`;

const LOCAL_STORAGE_KEYS = {
  LAST_WATCHED_EPISODE: 'last-watched-',
  WATCHED_EPISODES: 'watched-episodes-',
  LAST_ANIME_VISITED: 'last-anime-visited',
};

// Main Component
const Watch: React.FC = () => {
  const videoPlayerContainerRef = useRef<HTMLDivElement>(null);
  const [videoPlayerWidth, setVideoPlayerWidth] = useState('100%');
  const getSourceTypeKey = (animeId: string | undefined) =>
    `source-[${animeId}]`;
  const getLanguageKey = (animeId: string | undefined) =>
    `subOrDub-[${animeId}]`;
  const updateVideoPlayerWidth = useCallback(() => {
    if (videoPlayerContainerRef.current) {
      const width = `${videoPlayerContainerRef.current.offsetWidth}px`;
      setVideoPlayerWidth(width);
    }
  }, [setVideoPlayerWidth, videoPlayerContainerRef]);
  const [maxEpisodeListHeight, setMaxEpisodeListHeight] =
    useState<string>('100%');
  const { animeId, animeTitle, episodeNumber } = useParams<{
    animeId?: string;
    animeTitle?: string;
    episodeNumber?: string;
  }>();
  const STORAGE_KEYS = {
    SOURCE_TYPE: `source-[${animeId}]`,
    LANGUAGE: `subOrDub-[${animeId}]`,
  };
  const navigate = useNavigate();
  const [selectedBackgroundImage, setSelectedBackgroundImage] =
    useState<string>('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode>({
    id: '0',
    number: 1,
    title: '',
    image: '',
    description: '',
    imageHash: '',
    airDate: '',
  });
  const [animeInfo, setAnimeInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEpisodeChanging, setIsEpisodeChanging] = useState(false);
  const [showNoEpisodesMessage, setShowNoEpisodesMessage] = useState(false);
  const [lastKeypressTime, setLastKeypressTime] = useState(0);
  const [sourceType, setSourceType] = useState(
    () => localStorage.getItem(STORAGE_KEYS.SOURCE_TYPE) || 'default',
  );
  const [embeddedVideoUrl, setEmbeddedVideoUrl] = useState('');
  const [language, setLanguage] = useState(
    () => localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'sub',
  );
  const [downloadLink, setDownloadLink] = useState('');
  const nextEpisodeAiringTime =
    animeInfo && animeInfo.nextAiringEpisode
      ? animeInfo.nextAiringEpisode.airingTime * 1000
      : null;
  const nextEpisodenumber = animeInfo?.nextAiringEpisode?.episode;
  const countdown = useCountdown(nextEpisodeAiringTime);
  const currentEpisodeIndex = episodes.findIndex(
    (ep) => ep.id === currentEpisode.id,
  );
  const [languageChanged, setLanguageChanged] = useState(false);

  //----------------------------------------------MORE VARIABLES----------------------------------------------
  const GoToHomePageButton = () => {
    const navigate = useNavigate();

    const handleClick = () => {
      navigate('/home');
    };

    return (
      <StyledHomeButton onClick={handleClick}>Go back Home</StyledHomeButton>
    );
  };

  // FETCH VIDSTREAMING VIDEO
  const fetchVidstreamingUrl = async (episodeId: string) => {
    try {
      const embeddedServers = await fetchAnimeEmbeddedEpisodes(episodeId);
      if (embeddedServers && embeddedServers.length > 0) {
        const vidstreamingServer = embeddedServers.find(
          (server: any) => server.name === 'Vidstreaming',
        );
        const selectedServer = vidstreamingServer || embeddedServers[0];
        setEmbeddedVideoUrl(selectedServer.url);
      }
    } catch (error) {
      console.error(
        'Error fetching Vidstreaming servers for episode ID:',
        episodeId,
        error,
      );
    }
  };

  // FETCH GOGO VIDEO
  const fetchEmbeddedUrl = async (episodeId: string) => {
    try {
      const embeddedServers = await fetchAnimeEmbeddedEpisodes(episodeId);
      if (embeddedServers && embeddedServers.length > 0) {
        const gogoServer = embeddedServers.find(
          (server: any) => server.name === 'Gogo server',
        );
        const selectedServer = gogoServer || embeddedServers[0];
        setEmbeddedVideoUrl(selectedServer.url);
      }
    } catch (error) {
      console.error(
        'Error fetching gogo servers for episode ID:',
        episodeId,
        error,
      );
    }
  };

  // SAVE TO LOCAL STORAGE NAVIGATED/CLICKED EPISODES
  const updateWatchedEpisodes = (episode: Episode) => {
    const watchedEpisodesJson = localStorage.getItem(
      LOCAL_STORAGE_KEYS.WATCHED_EPISODES + animeId,
    );
    const watchedEpisodes: Episode[] = watchedEpisodesJson
      ? JSON.parse(watchedEpisodesJson)
      : [];
    if (!watchedEpisodes.find((ep) => ep.id === episode.id)) {
      watchedEpisodes.push(episode);
      localStorage.setItem(
        LOCAL_STORAGE_KEYS.WATCHED_EPISODES + animeId,
        JSON.stringify(watchedEpisodes),
      );
    }
  };

  // Fetch episode details
  const fetchEpisodeDetails = async (episodeId: string) => {
    if (!animeId) return;
    setLoading(true);
    try {
      const animeEpisodes = await fetchAnimeEpisodes(animeId);
      const episode = animeEpisodes.find((ep) => ep.id === episodeId);
      if (episode) {
        setCurrentEpisode(episode);
        updateWatchedEpisodes(episode);
        if (sourceType === 'gogo') {
          await fetchEmbeddedUrl(episodeId);
        } else {
          await fetchVidstreamingUrl(episodeId);
        }
      }
    } catch (error) {
      console.error('Error fetching episode details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch anime info
  const fetchAnimeDetails = async () => {
    if (!animeId) return;
    try {
      const animeData = await fetchAnimeData(animeId);
      setAnimeInfo(animeData);
      setSelectedBackgroundImage(animeData.backgroundImage);
      const episodesList = await fetchAnimeEpisodes(animeId);
      setEpisodes(episodesList);
      const episodeId = episodeNumber || episodesList[0]?.id;
      if (episodeId) {
        fetchEpisodeDetails(episodeId);
      }
    } catch (error) {
      console.error('Error fetching anime details:', error);
    }
  };

  useEffect(() => {
    fetchAnimeDetails();
    updateVideoPlayerWidth();
    window.addEventListener('resize', updateVideoPlayerWidth);
    return () => window.removeEventListener('resize', updateVideoPlayerWidth);
  }, [animeId, episodeNumber, sourceType, updateVideoPlayerWidth]);

  // HANDLER FOR EPISODE CHANGES
  const handleEpisodeChange = (episodeId: string) => {
    setIsEpisodeChanging(true);
    fetchEpisodeDetails(episodeId);
    setIsEpisodeChanging(false);
  };

  const handleLanguageChange = (newLanguage: string) => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
    setLanguage(newLanguage);
    setLanguageChanged(true);
  };

  const handleEpisodeEnd = () => {
    if (currentEpisodeIndex < episodes.length - 1) {
      handleEpisodeChange(episodes[currentEpisodeIndex + 1].id);
    }
  };

  const handlePrevEpisode = () => {
    if (currentEpisodeIndex > 0) {
      handleEpisodeChange(episodes[currentEpisodeIndex - 1].id);
    }
  };

  const handleNextEpisode = () => {
    if (currentEpisodeIndex < episodes.length - 1) {
      handleEpisodeChange(episodes[currentEpisodeIndex + 1].id);
    }
  };

  const updateDownloadLink = (link: string) => {
    setDownloadLink(link);
  };

  return (
    <WatchContainer>
      <GoToHomePageButton />
      <WatchWrapper>
        <SourceAndData $videoPlayerWidth={videoPlayerWidth}>
          <VideoPlayerContainer ref={videoPlayerContainerRef}>
            {loading ? (
              <SkeletonPlayer />
            ) : sourceType === 'default' ? (
              <Player
                episodeId={currentEpisode.id}
                animeTitle={animeInfo?.title?.english || animeInfo?.title?.romaji}
                banner={selectedBackgroundImage}
                updateDownloadLink={updateDownloadLink}
                onEpisodeEnd={handleEpisodeEnd}
                onPrevEpisode={handlePrevEpisode}
                onNextEpisode={handleNextEpisode}
              />
            ) : (
              <EmbedPlayer src={embeddedVideoUrl} />
            )}
          </VideoPlayerContainer>
          <RalationsTable>
            <IframeTrailer
              src={`https://www.youtube.com/embed/${animeInfo?.trailer?.id}`}
              title="Trailer"
              allowFullScreen
            />
          </RalationsTable>
        </SourceAndData>
        <EpisodeListContainer>
          {showNoEpisodesMessage ? (
            <NoEpsFoundDiv>
              <NoEpsImage>
                <img src={Image404URL} alt="No episodes found" />
              </NoEpsImage>
              <div>No episodes found</div>
            </NoEpsFoundDiv>
          ) : (
            <EpisodeList
              episodes={episodes}
              onEpisodeClick={handleEpisodeChange}
            />
          )}
        </EpisodeListContainer>
      </WatchWrapper>
    </WatchContainer>
  );
};

export default Watch;
