import { useState, useEffect, useContext } from 'react'
import { createClient, basicClient, searchPublications, explorePublications, getManyPublications } from '../api'
import { css } from '@emotion/css'
import { ethers } from 'ethers'
import { trimString, generateRandomColor, getSigner } from '../utils'
import { Placeholders, Button, ButtonCollect } from '../components'
import { AppContext } from '../context'
import Link from 'next/link'
import { LENS_HUB_CONTRACT_ADDRESS } from '../api'
import LENSHUB from '../abi/lenshub'


const typeMap = {
  Comment: "Comment",
  Mirror: "Mirror",
  Post: "Post"
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [loadingState, setLoadingState] = useState('loading')
  const [searchString, setSearchString] = useState('')
  const { profile, allOwners, minted } = useContext(AppContext)
  const ipfsUrl = "https://skywalker.infura-ipfs.io/ipfs/"

  useEffect(() => {
    fetchPosts() 
  }, [profile])

  async function fetchPosts() {
    const provider = new ethers.providers.Web3Provider(
      (window).ethereum
    )
    const addresses = await provider.listAccounts();
    console.log('addresses: ', addresses)
    if (profile) {
      try {
        const posts = await getManyPosts()
        setPosts(posts)
        setLoadingState('loaded')
      } catch (error) {
        console.log({ error })
      }
    } else if (!addresses.length) {
      try {
        const response = await basicClient.query(explorePublications).toPromise()
        const posts = response.data.explorePublications.items.filter(post => {
          if (post.profile) {
            post.backgroundColor = generateRandomColor()
            return post
          }
        })
        setPosts(posts)
        setLoadingState('loaded')
      } catch (error) {
        console.log({ error })
      }
    }
  }

  async function getManyPosts() {
    try {
      const profileIds = await allOwners
      const response = await basicClient.query(getManyPublications, {
        ids: profileIds, limit: 20
      }).toPromise()

      const posts = response.data.publications.items
      console.log(posts)
      return posts
    } catch (err) {
      console.log(err)
    }
  }

  async function collectPost(postId) {
    const contract = new ethers.Contract(
      LENS_HUB_CONTRACT_ADDRESS,
      LENSHUB,
      getSigner()
    )

    try {
      const exploded = postId.split("-")
      const pubId = exploded[1]
      const tx = await contract.collect(exploded[0], pubId, [])
      await tx.wait()
    } catch (err) {
      console.log('error when collect post: ', err)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      searchForPost()
    }
  }

  return (
    <div>
      <div className={listItemContainerStyle}>
        {
          loadingState === 'no-results' && (
            <h2>No results....</h2>
          )
        }
        {
           loadingState === 'loading' && <Placeholders number={6} />
        }
        {
          (posts) ?
          posts.map((post, index) => (
            <div className={listItemStyle} key={index}>
              <Link href={`/profile/${post.profile.id || post.profile.profileId}`}>
                <a>
                  <div>
                    <p className={itemTypeStyle}>{typeMap[post.__typename]}</p>
                    <div className={profileContainerStyle} >
                      {
                        post.profile.picture && post.profile.picture.original ? (
                        <img src={post.profile.picture.original.url.replace("ipfs://", ipfsUrl)} className={profileImageStyle} />
                        ) : (
                          <div
                            className={
                              css`
                              ${placeholderStyle};
                              background-color: ${post.backgroundColor};
                              `
                            }
                          />
                        )
                      }
                      
                      <div className={profileInfoStyle}>
                        <h3 className={nameStyle}>{post.profile.name}</h3>
                        <p className={handleStyle}>{post.profile.handle}</p>
                      </div>
                    </div>
                    <div>
                      <p className={latestPostStyle}>{trimString(post.metadata.content, 200)}</p>
                      {(post.metadata.media.length > 0) ? (<img src = {post.metadata.media[0].original.url.replace("ipfs://", ipfsUrl)} className={
                        css`
                        max-width: -webkit-fill-available
                        `
                      }></img>) : ''}
                      
                    </div>
                  </div>
                </a>
              </Link>
              {minted && <ButtonCollect
                  buttonText="COLLECT POST"
                  onClick={() => collectPost(post.id)}
                  key={`collect-${index}`}
              />}
            </div>
          )) : ""
        }
      </div>
    </div>
  )
}

const searchContainerStyle = css`
  padding: 40px 0px 30px;
`

const latestPostStyle = css`
  margin: 23px 0px 5px;
  word-wrap: break-word;
`

const profileContainerStyle = css`
  display: flex;
  flex-direction: row;
`

const profileImageStyle = css`
  width: 42px;
  height: 42px;
  border-radius: 34px;
`

const placeholderStyle = css`
  ${profileImageStyle};
`

const listItemContainerStyle = css`
  display: flex;
  flex-direction: column;
`

const listItemStyle = css`
  background-color: white;
  margin-top: 13px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, .15);
  padding: 21px;
`

const profileInfoStyle = css`
  margin-left: 10px;
`

const nameStyle = css`
  margin: 0 0px 5px;
`

const handleStyle = css`
  margin: 0px 0px 5px;
  color: #b900c9;
`

const itemTypeStyle = css`
  margin: 0;
  font-weight: 500;
  font-size: 14px;
  color: rgba(0, 0, 0, .45);
  margin-bottom: 16px;
`