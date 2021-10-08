import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import {
  ImageContainer,
  DurationContainer,
  StyledCardHeader,
  VideoTitle,
} from '../Videos/VideoCard'
import { MoreButton } from '../Videos/MoreButton'
import { ChannelDetails, DotSeparator } from '../Videos/ChannelDetails'
import he from 'he'
import { request } from '../utils/api'
import moment from 'moment'
import numeral from 'numeral'
import {
  TWO_COL_MIN_WIDTH,
  useIsMobileView,
  getFormattedDurationString,
  queryChannelDetails,
  TWO_COL_MAX_WIDTH,
} from '../utils/utils'
import { Typography, Avatar } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import { useMediaQuery } from '@material-ui/core'

const ResultsVideoCard = ({ video }) => {
  const isMobileView = useIsMobileView()
  const showSubscribeButton = useMediaQuery(
    `(min-width: ${TWO_COL_MAX_WIDTH}px)`
  )

  const {
    id: { kind, videoId },
    snippet: {
      channelId,
      channelTitle,
      title,
      publishedAt,
      thumbnails,
      description,
    },
  } = video

  const isVideo = kind === 'youtube#video'
  const thumbnailImage = thumbnails.medium.url

  const [viewCount, setViewCount] = useState(null)
  const [duration, setDuration] = useState(null)
  const [channelAvatar, setChannelAvatar] = useState(null)
  // const [isChannel, setIsChannel] = useState(false)
  const [channelInfo, setChannelInfo] = useState(null)

  // this is unique to searchResults, because popular videos no need to get more details from 'contentDetails,statistics'
  useEffect(() => {
    const getVideoDetails = async () => {
      try {
        const {
          data: { items },
        } = await request('/videos', {
          params: {
            part: 'contentDetails,statistics',
            id: videoId,
          },
        })
        setDuration(items[0].contentDetails.duration)
        setViewCount(items[0].statistics.viewCount)

        // temp localStorage snippet
        localStorage.setItem(
          `${videoId}_duration`,
          JSON.stringify(items[0].contentDetails.duration)
        )
        localStorage.setItem(
          `${videoId}_viewCount`,
          JSON.stringify(items[0].statistics.viewCount)
        )
      } catch (error) {
        console.log(error)
      }
    }

    // temp if...else and localStorage snippet
    const storedDuration = JSON.parse(
      localStorage.getItem(`${videoId}_duration`)
    )
    const storedViewCount = JSON.parse(
      localStorage.getItem(`${videoId}_viewCount`)
    )

    if (storedDuration && storedViewCount) {
      setDuration(storedDuration)
      setViewCount(storedViewCount)
    } else {
      getVideoDetails()
    }
  }, [videoId])

  // to get channelAvatar for video, get channel details for channel
  useEffect(() => {
    // localStorage, to be deleted when finished.
    let storedChannelAvatar
    let storedChannelInfo

    if (isVideo) {
      storedChannelAvatar = JSON.parse(
        localStorage.getItem(`${videoId}_channelAvatar`)
      )
    } else {
      storedChannelInfo = JSON.parse(
        localStorage.getItem(`${channelId}_channelInfo`)
      )
    }

    if (storedChannelAvatar) {
      setChannelAvatar(storedChannelAvatar)
    } else if (storedChannelInfo) {
      // confirm the data type stored in this var
      console.log(`inside useEffect, retrieve storedChannelInfo`)
      console.log(storedChannelInfo)
      setChannelInfo(storedChannelInfo)
    } else {
      // no need videoId if not using localStorage
      queryChannelDetails(
        setChannelAvatar,
        setChannelInfo,
        channelId,
        videoId,
        isVideo
      )
    }
  }, [channelId])

  const formattedDuration = getFormattedDurationString(duration)

  return (
    <StyledCard>
      {/* if data point is a returned channel, img is rounded, no duration */}
      {!isVideo ? (
        <MobileChannelImageContainer>
          <MobileChannelImg src={thumbnailImage} />
        </MobileChannelImageContainer>
      ) : (
        <StyledImageContainer>
          <StyledImg src={thumbnailImage} />
          <DurationContainer variant="body2">
            {formattedDuration}
          </DurationContainer>
        </StyledImageContainer>
      )}

      {isMobileView && isVideo && (
        // Mobile view can make sure of CardHeader from MUI
        <SearchCardHeader
          action={<MoreButton isSearchPage={true} />}
          title={
            <SearchVideoTitle variant="h4">{he.decode(title)}</SearchVideoTitle>
          }
          subheader={
            <ChannelDetails
              {...{
                channelTitle,
                publishedAt,
                viewCount,
                isSearchPage: true,
              }}
            />
          }
        />
      )}

      {isMobileView && !isVideo && (
        <SearchCardHeader
          title={
            <SearchVideoTitle variant="h4">
              {he.decode(channelTitle)}
            </SearchVideoTitle>
          }
          subheader={
            <ChannelStatsContainer
              style={isMobileView ? { fontSize: '12px' } : null}
            >
              <p>
                {channelInfo &&
                  numeral(channelInfo.statistics.videoCount).format('0,0')}{' '}
                videos
              </p>
              <p>
                {channelInfo &&
                  numeral(channelInfo.statistics.subscriberCount).format(
                    '0.0.a'
                  )}{' '}
                subscribers
              </p>
            </ChannelStatsContainer>
          }
        />
      )}

      {!isMobileView && isVideo && (
        // desktop view can't use MUI CardHeader because position of elements inside CardHeader can't be changed.
        <ContentContainer>
          <VideoContentTop>
            <SearchVideoTitle variant="h3">{he.decode(title)}</SearchVideoTitle>
            <MoreButton isSearchPage={true} />
          </VideoContentTop>

          <StatsContainer>
            <ContentText variant="body2">
              <span style={{ marginRight: '4px' }}>
                {numeral(viewCount).format('0.a')} views
              </span>
              <DotSeparator /> <span>{moment(publishedAt).fromNow()}</span>
            </ContentText>
          </StatsContainer>

          <AvatarContainer>
            <StyledAvatar src={channelAvatar} />
            <ContentText variant="subtitle1" style={{ paddingLeft: '8px' }}>
              {channelTitle}
            </ContentText>
          </AvatarContainer>

          <DescriptionsContainer>
            {description.substr(0, 120) + '...'}
          </DescriptionsContainer>
        </ContentContainer>
      )}

      {!isMobileView && !isVideo && (
        <ContentContainer style={{ justifyContent: 'center' }}>
          <VideoContentTop>
            <SearchVideoTitle variant="h3">
              {he.decode(channelTitle)}
            </SearchVideoTitle>
          </VideoContentTop>

          <StatsContainer>
            <ContentText variant="body2">
              <span style={{ marginRight: '4px' }}>
                {channelInfo &&
                  numeral(channelInfo.statistics.subscriberCount).format(
                    '0.0.a'
                  )}{' '}
                subscribers
              </span>
              <DotSeparator />{' '}
              <span>
                {channelInfo &&
                  numeral(channelInfo.statistics.videoCount).format('0,0')}{' '}
                videos
              </span>
            </ContentText>
          </StatsContainer>

          <DescriptionsContainer>
            {channelInfo &&
              channelInfo.snippet.description.substr(0, 120) + '...'}
          </DescriptionsContainer>
        </ContentContainer>
      )}

      {!isMobileView && !isVideo && showSubscribeButton && (
        <SubscribeButtonContainer>
          <SubscribeButton size="small">SUBSCRIBE</SubscribeButton>
        </SubscribeButtonContainer>
      )}
    </StyledCard>
  )
}

export default ResultsVideoCard

const SubscribeButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
`

const SubscribeButton = styled(Button)`
  && {
    background-color: #c00;
    color: white;
    /* font-size: 14px; */
    font-weight: 500;
    padding: 10px 16px;
    letter-spacing: 0.5px;
    border-radius: 2px;
    margin: 0 4px;

    &:hover {
      background-color: #c00;
    }
  }
`

const ChannelStatsContainer = styled.div`
  opacity: 0.6;
  line-height: 14px;
  color: rgb(96, 96, 96);
  /* letter-spacing: 0.3px; */
  @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
    opacity: 1;
    display: flex;
    flex-wrap: wrap;
  }
`

const DescriptionsContainer = styled(Typography)`
  && {
    font-size: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
      margin-top: 4px;
      width: 80%;
    }
  }
`

const ContentText = styled(Typography)`
  && {
    font-size: 12px;
  }
`

const StatsContainer = styled.div`
  font-size: 12px;
`

const StyledAvatar = styled(Avatar)`
  && {
    height: 24px;
    width: 24px;
  }
`

const AvatarContainer = styled.div`
  display: flex;
  padding: 12px 0;
  align-items: center;
`

const VideoContentTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
`

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const SearchCardHeader = styled(StyledCardHeader)`
  && {
    align-items: flex-start;
    flex-grow: 1;
    padding: 0 8px;

    .MuiCardHeader-content {
      padding: 0;
    }
  }
`
const StyledImg = styled.img`
  height: 100%;
  cursor: pointer;

  @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
    height: auto;
    width: 100%;
  }
`

const StyledImageContainer = styled(ImageContainer)`
  @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
    min-width: 240px;
    max-width: 360px;
    margin-right: 12px;
    flex: 1 0 50%;
    width: 100%;
  }
`

const MobileChannelImageContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
    min-width: 240px;
    max-width: 360px;
    margin-right: 12px;
    flex: 1 0 50%;
    width: 100%;
  }
`

const MobileChannelImg = styled.img`
  height: 90px;
  width: 90px;
  border-radius: 50%;
  cursor: pointer;
  @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
    height: 136px;
    width: 136px;
  }
`

const SearchVideoTitle = styled(VideoTitle)`
  && {
    font-weight: 400;
    @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
      font-size: 18px;
      max-height: 52px;
      line-height: 26px;
    }
  }
`

const StyledCard = styled.div`
  margin-top: 12px;
  padding: 0 12px;
  height: 90px;
  display: flex;

  @media screen and (min-width: ${TWO_COL_MIN_WIDTH}px) {
    height: 100%;
    width: 100%;
  }
`
