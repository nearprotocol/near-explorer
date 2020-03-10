// import InfiniteScroll from "react-infinite-scroll-component";

import React from "react";

import BlocksApi, * as B from "../../libraries/explorer-wamp/blocks";

import autoRefreshHandler from "../utils/autoRefreshHandler";
import FlipMove from "../utils/FlipMove";
import PaginationSpinner from "../utils/PaginationSpinner";
import BlocksList from "./BlocksList";

export interface Props {
  items: B.BlockInfo[];
}

let count = 15;
const batchLength = 15;

const fetchBlocks = async () => {
  return await new BlocksApi().getBlocks(count);
};

class Blocks extends React.Component<Props> {
  static defaultProps = {
    items: []
  };

  _blocksApi: BlocksApi | null;

  constructor(props: Props) {
    super(props);
    this._blocksApi = null;
  }

  fetchMoreBlocks = async () => {
    count += batchLength;
  };

  render() {
    const { items } = this.props;
    if (items.length === 0) {
      return <PaginationSpinner hidden={false} />;
    }
    return (
      <>
        <FlipMove duration={1000} staggerDurationBy={0}>
          {/* <InfiniteScroll
        dataLength={this.props.items.length}
        next={this.fetchMoreBlocks}
        hasMore={true}
        loader={<PaginationSpinner hidden={false} />}
        endMessage={
          <p style={{ textAlign: "center" }}>
            <b>Yay! You have seen it all</b>
          </p>
        }
      > */}
          <BlocksList blocks={items} />
          {/* </InfiniteScroll> */}
        </FlipMove>
      </>
    );
  }
}

export default autoRefreshHandler(Blocks, fetchBlocks);
